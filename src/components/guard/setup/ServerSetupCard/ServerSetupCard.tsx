import { FormControl, Select, SimpleGrid, Stack } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core"
import Button from "components/common/Button"
import Card from "components/common/Card"
import CardMotionWrapper from "components/common/CardMotionWrapper"
import FormErrorMessage from "components/common/FormErrorMessage"
import Section from "components/common/Section"
import useCreateGuild from "components/create-guild/hooks/useCreateGuild"
import useCreateRole from "components/create-guild/hooks/useCreateRole"
import useServerData from "components/create-guild/PickRolePlatform/components/Discord/hooks/useServerData"
import useSetImageAndNameFromPlatformData from "components/create-guild/PickRolePlatform/hooks/useSetImageAndNameFromPlatformData"
import useEditGuild from "components/[guild]/EditGuildButton/hooks/useEditGuild"
import { Web3Connection } from "components/_app/Web3ConnectionManager"
import useUploadPromise from "hooks/useUploadPromise"
import { useRouter } from "next/router"
import { useContext, useEffect, useMemo, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import useGuildByPlatformId from "../hooks/useGuildByPlatformId"
import Disclaimer from "./components/Disclaimer"
import PickSecurityLevel from "./components/PickSecurityLevel/PickSecurityLevel"

const ServerSetupCard = (): JSX.Element => {
  const { account } = useWeb3React()
  const { openWalletSelectorModal } = useContext(Web3Connection)
  const router = useRouter()

  const {
    control,
    register,
    setValue,
    formState: { errors },
    handleSubmit: formHandleSubmit,
  } = useFormContext()

  const selectedServer = useWatch({
    control,
    name: "DISCORD.platformId",
  })

  const {
    data: { channels, serverIcon, serverName },
  } = useServerData(selectedServer, {
    refreshInterval: 0,
  })

  const [uploadPromise, setUploadPromise] = useState(null)
  useSetImageAndNameFromPlatformData(serverIcon, serverName, setUploadPromise)

  const { handleSubmit, isUploading, shouldBeLoading } = useUploadPromise(
    formHandleSubmit,
    uploadPromise
  )

  const { onSubmit, isLoading, response, isSigning } = useCreateGuild()

  const { id, platforms, urlName, hasFreeEntry } =
    useGuildByPlatformId(selectedServer)

  const {
    isLoading: isRoleCreateLoading,
    isSigning: isRoleCreateSigning,
    onSubmit: onRoleCreateSubmit,
  } = useCreateRole()

  const {
    onSubmit: onEditSubmit,
    isLoading: isEditLoading,
    response: editResponse,
    isSigning: isEditSigning,
  } = useEditGuild({ guildId: id, onSuccess: () => router.push(`/${urlName}`) })

  useEffect(() => {
    if (hasFreeEntry === false) {
      setValue("roles", undefined)
    }
  }, [hasFreeEntry])

  useEffect(() => {
    if (id) {
      setValue("requirements", undefined)
      setValue("imageUrl", undefined, { shouldTouch: true })
      setValue("name", undefined, { shouldTouch: true })
    }
  }, [id])

  const loadingText = useMemo((): string => {
    if (isUploading) return "Uploading Guild image"
    if (isSigning || isEditSigning) return "Check your wallet"
    return "Saving data"
  }, [isSigning, isUploading, isEditSigning])

  return (
    <CardMotionWrapper>
      <Card px={{ base: 5, sm: 6 }} py={7}>
        <Stack spacing={8}>
          {!id && (
            <Section title="Entry channel">
              <FormControl
                isInvalid={!!errors?.channelId}
                isDisabled={!channels?.length}
                defaultValue={channels?.[0]?.id}
              >
                <Select
                  maxW="50%"
                  size={"lg"}
                  {...register("channelId", {
                    required: "This field is required.",
                  })}
                >
                  <option value={0} defaultChecked>
                    Create a new channel for me
                  </option>
                  {channels?.map((channel, i) => (
                    <option
                      key={channel.id}
                      value={channel.id}
                      defaultChecked={i === 0}
                    >
                      {channel.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors?.channelId?.message}</FormErrorMessage>
              </FormControl>
            </Section>
          )}

          <Section title="Security level">
            <PickSecurityLevel />
          </Section>

          <Disclaimer />

          <SimpleGrid columns={2} gap={4}>
            <Button
              colorScheme="gray"
              disabled={!!account}
              onClick={openWalletSelectorModal}
            >
              Connect wallet
            </Button>
            {hasFreeEntry === false ? (
              <Button
                colorScheme="DISCORD"
                disabled={!account || isRoleCreateLoading || isRoleCreateSigning}
                isLoading={isRoleCreateLoading || isRoleCreateSigning}
                loadingText={isRoleCreateSigning ? "Check your wallet" : "Saving"}
                onClick={() =>
                  onRoleCreateSubmit({
                    guildId: id,
                    ...(platforms?.[0]
                      ? {
                          platform: platforms[0].type,
                          platformId: platforms[0].platformId,
                        }
                      : {}),
                    // channelId: platforms?.[0]?.inviteChannel,
                    name: "Verified",
                    description: "",
                    logic: "AND",
                    requirements: [{ type: "FREE" }],
                    imageUrl: "/guildLogos/0.svg",
                  })
                }
              >
                Create Verified role
              </Button>
            ) : (
              <Button
                colorScheme="green"
                disabled={
                  !account ||
                  response ||
                  editResponse ||
                  isLoading ||
                  isSigning ||
                  shouldBeLoading ||
                  isEditLoading ||
                  isEditSigning
                }
                isLoading={
                  isLoading ||
                  isSigning ||
                  shouldBeLoading ||
                  isEditLoading ||
                  isEditSigning
                }
                loadingText={loadingText}
                onClick={handleSubmit(id ? onEditSubmit : onSubmit, console.log)}
              >
                Let's go!
              </Button>
            )}
          </SimpleGrid>
        </Stack>
      </Card>
    </CardMotionWrapper>
  )
}

export default ServerSetupCard